/* eslint-disable func-names, no-mutable-exports, comma-dangle, strict */

((Drupal, drupalSettings, once) => {
  const breakpoint = 1024;
  const breakpointLarge = 1280;
  const storageMobile = 'Drupal.gin.sidebarExpanded.mobile';
  const storageDesktop = 'Drupal.gin.sidebarExpanded.desktop';
  const storageWidth = "Drupal.gin.sidebarWidth";
  const reSizer = document.getElementById('gin-sidebar-draggable');
  const resizable = document.getElementById('default_admin_sidebar');
  const sidebar = document.getElementById('default_admin_sidebar');
  let isResizing = false;
  let startX, startWidth;

  // Modal state: when the sidebar overlays content (narrow viewports) it must
  // behave like a modal dialog so keyboard and screen-reader users cannot
  // reach the content behind the greyed-out overlay.
  let modalActive = false;
  let backgroundContainers = [];
  let lastTrigger = null;

  Drupal.behaviors.ginSidebar = {
    attach: function attach(context) {
      Drupal.ginSidebar.init(context);
    },
  };

  Drupal.ginSidebar = {
    init: function (context) {
      once('ginSidebarInit', '#default_admin_sidebar', context).forEach(() => {
        // If variable does not exist, create it, default being to show sidebar.
        if (!localStorage.getItem(storageDesktop)) {
          localStorage.setItem(storageDesktop, 'true');
        }

        // Set mobile initial to false.
        if (window.innerWidth >= breakpoint) {
          if (localStorage.getItem(storageDesktop) === 'true') {
            this.showSidebar();
          }
          else {
            this.collapseSidebar();
          }
        }

        // Show navigation with shortcut:
        // OPTION + S (Mac) / ALT + S (Windows)
        document.addEventListener('keydown', e => {
          if (e.altKey === true && e.code === 'KeyS') {
            this.toggleSidebar();
          }
        });

        // Resize observer.
        const resizeHandler = new ResizeObserver(entries => {
          for (let entry of entries) {
            Drupal.debounce(this.handleResize(entry.contentRect), 150);
          }
        });
        resizeHandler.observe(document.querySelector('html'));

        // Init resizable sidebar.
        this.resizeInit();
      });

      // Toolbar toggle
      once('ginSidebarToggle', '.meta-sidebar__trigger', context).forEach(el => el.addEventListener('click', e => {
        e.preventDefault();
        lastTrigger = el;
        this.removeInlineStyles();
        this.toggleSidebar(true);
      }));

      // Toolbar close
      once('ginSidebarClose', '.meta-sidebar__close, .meta-sidebar__overlay', context).forEach(el => el.addEventListener('click', e => {
        e.preventDefault();
        this.removeInlineStyles();
        this.collapseSidebar(true);
      }));
    },

    toggleSidebar: (fromUser = false) => {
      // Set active state.
      if (document.querySelector('.meta-sidebar__trigger').classList.contains('is-active')) {
        Drupal.ginSidebar.collapseSidebar(fromUser);
        Drupal.ginStickyFormActions?.hideMoreActions();
      }
      else {
        Drupal.ginSidebar.showSidebar(fromUser);
        Drupal.ginStickyFormActions?.hideMoreActions();
      }
    },

    isModalWidth: () => window.innerWidth < breakpoint,

    showSidebar: (fromUser = false) => {
      const chooseStorage = window.innerWidth < breakpoint ? storageMobile : storageDesktop;
      const hideLabel = Drupal.t('Hide sidebar panel');
      const sidebarTrigger = document.querySelector('.meta-sidebar__trigger');
      if (sidebarTrigger) {
        sidebarTrigger.querySelector('span').innerHTML = hideLabel;
        sidebarTrigger.setAttribute('title', hideLabel);
        if (sidebarTrigger.nextSibling) {
          sidebarTrigger.nextSibling.innerHTML = hideLabel;
        }
        sidebarTrigger.setAttribute('aria-expanded', 'true');
        sidebarTrigger.classList.add('is-active');
      }

      document.body.setAttribute('data-meta-sidebar', 'open');

      // When the sidebar overlays the page content it must act as a modal:
      // trap focus inside it and make the background inert.
      if (Drupal.ginSidebar.isModalWidth() && sidebar) {
        if (!modalActive) {
          Drupal.ginSidebar.enableModal();
        }
        if (fromUser) {
          Drupal.ginSidebar.focusSidebar();
        }
      }
      else if (modalActive) {
        Drupal.ginSidebar.disableModal();
      }

      // Expose to localStorage.
      localStorage.setItem(chooseStorage, 'true');

      // Check which toolbar is active.
      if (window.innerWidth < breakpointLarge) {
        Drupal.ginCoreNavigation?.collapseToolbar();
      }
    },

    collapseSidebar: (fromUser = false) => {
      const chooseStorage = window.innerWidth < breakpoint ? storageMobile : storageDesktop;
      const showLabel = Drupal.t('Show sidebar panel');
      const sidebarTrigger = document.querySelector('.meta-sidebar__trigger');
      if (sidebarTrigger) {
        sidebarTrigger.querySelector('span').innerHTML = showLabel;
        sidebarTrigger.setAttribute('title', showLabel);
        if (sidebarTrigger.nextSibling) {
          sidebarTrigger.nextSibling.innerHTML = showLabel;
        }
        sidebarTrigger.setAttribute('aria-expanded', 'false');
        sidebarTrigger.classList.remove('is-active');
      }

      document.body.setAttribute('data-meta-sidebar', 'closed');

      // Release the modal behaviour before handing focus back to the trigger.
      if (modalActive) {
        Drupal.ginSidebar.disableModal(fromUser && lastTrigger);
      }

      // Expose to localStorage.
      localStorage.setItem(chooseStorage, 'false');
    },

    // --- Modal helpers -------------------------------------------------------

    enableModal: () => {
      if (modalActive || !sidebar) {
        return;
      }
      Drupal.ginSidebar.makeBackgroundInert();
      document.addEventListener('keydown', Drupal.ginSidebar.modalKeydown, true);
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
      sidebar.setAttribute('aria-label', Drupal.t('Sidebar'));
      modalActive = true;
    },

    disableModal: (returnFocus = false) => {
      if (!modalActive) {
        return;
      }
      Drupal.ginSidebar.releaseBackground();
      document.removeEventListener('keydown', Drupal.ginSidebar.modalKeydown, true);
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
      sidebar.removeAttribute('aria-label');
      modalActive = false;
      if (returnFocus && lastTrigger && document.contains(lastTrigger)) {
        lastTrigger.focus();
      }
    },

    makeBackgroundInert: () => {
      const trigger = document.querySelector('.meta-sidebar__trigger');
      backgroundContainers = Drupal.ginSidebar.getBackgroundContainers(sidebar, trigger);
      backgroundContainers.forEach(el => {
        el.setAttribute('inert', '');
        el.setAttribute('aria-hidden', 'true');
      });
    },

    releaseBackground: () => {
      backgroundContainers.forEach(el => {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      });
      backgroundContainers = [];
    },

    // Collect every branch of the DOM that is not the sidebar panel (and not the
    // overlay) so it can be made inert while the modal is open. The single
    // sidebar control (.meta-sidebar__trigger) must stay interactive in both
    // states, so its container is kept alive and only its siblings are inerted.
    getBackgroundContainers: (panel, trigger) => {
      const containers = [];
      let node = panel;
      while (node && node.parentElement) {
        const parent = node.parentElement;
        for (const sibling of parent.children) {
          if (sibling === panel || sibling.contains(panel) || sibling.classList.contains('meta-sidebar__overlay')) {
            continue;
          }
          if (trigger && (sibling === trigger || sibling.contains(trigger))) {
            // Keep the trigger usable: inert only its siblings within this
            // container rather than the container that holds the trigger.
            for (const child of sibling.children) {
              if (child !== trigger && !child.contains(trigger)) {
                containers.push(child);
              }
            }
            continue;
          }
          containers.push(sibling);
        }
        node = parent;
        if (parent === document.body) {
          break;
        }
      }
      return containers;
    },

    // Focusable elements inside the modal, including the single sidebar control
    // so it stays reachable by keyboard while the panel is open.
    getModalFocusable: () => {
      const list = Drupal.ginSidebar.getFocusable(sidebar);
      const trigger = document.querySelector('.meta-sidebar__trigger');
      if (trigger && !list.includes(trigger)) {
        list.push(trigger);
      }
      return list;
    },

    getFocusable: (container) => {
      const selector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), details > summary';
      return Array.from(container.querySelectorAll(selector))
        .filter(el => el.offsetParent !== null || el === document.activeElement);
    },

    focusSidebar: () => {
      if (!sidebar) {
        return;
      }
      // Focus the dialog container so screen readers announce it, then Tab
      // moves into the first focusable field or the sidebar control.
      sidebar.focus();
    },

    // Keydown handler (capture phase) used while the modal is open.
    modalKeydown: (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        Drupal.ginSidebar.collapseSidebar(true);
        return;
      }
      if (e.key === 'Tab') {
        Drupal.ginSidebar.trapFocus(e);
      }
    },

    // Keep keyboard focus confined to the sidebar panel (plus the control).
    trapFocus: (e) => {
      if (!sidebar) {
        return;
      }
      const focusable = Drupal.ginSidebar.getModalFocusable();
      if (!focusable.length) {
        e.preventDefault();
        sidebar.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !sidebar.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      }
      else if (document.activeElement === last || !sidebar.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    },

    handleResize: (windowSize = window) => {
      Drupal.ginSidebar.removeInlineStyles();

      // If small viewport, always collapse sidebar.
      if (windowSize.width < breakpoint) {
        Drupal.ginSidebar.collapseSidebar();
      } else {
        // If large viewport, show sidebar if it was open before.
        if (localStorage.getItem(storageDesktop) === 'true') {
          Drupal.ginSidebar.showSidebar();
        } else {
          Drupal.ginSidebar.collapseSidebar();
        }
      }
    },

    removeInlineStyles: () => {
      // Remove init styles.
      const elementToRemove = document.querySelector('.gin-sidebar-inline-styles');
      if (elementToRemove) {
        elementToRemove.parentNode.removeChild(elementToRemove);
      }
    },

    resizeInit: function () {
      // Mouse
      reSizer.addEventListener('mousedown', this.resizeStart);
      document.addEventListener('mousemove', this.resizeWidth);
      document.addEventListener('mouseup', this.resizeEnd);

      // Touch
      reSizer.addEventListener('touchstart', this.resizeStart);
      document.addEventListener('touchmove', this.resizeWidth);
      document.addEventListener('touchend', this.resizeEnd);
    },

    resizeStart: (e) => {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startWidth = parseInt(document.defaultView.getComputedStyle(resizable).width, 10);
    },

    resizeEnd: () => {
      isResizing = false;
      const setWidth = document.documentElement.style.getPropertyValue('--admin-theme-sidebar-width');
      const currentWidth = setWidth ? setWidth : resizable.style.width;
      localStorage.setItem(storageWidth, currentWidth);
      document.removeEventListener('mousemove', this.resizeWidth);
      document.removeEventListener('touchend', this.resizeWidth);
    },

    resizeWidth: (e) => {
      if (isResizing) {
        let sidebarWidth = startWidth - (e.clientX - startX);

        if (sidebarWidth <= 240) {
          sidebarWidth = 240;
        } else if (sidebarWidth >= 560) {
          sidebarWidth = 560;
        }

        sidebarWidth = `${sidebarWidth}px`;
        // resizable.style.width = sidebarWidth;
        document.documentElement.style.setProperty('--admin-theme-sidebar-width', sidebarWidth);
      }
    }

  };
})(Drupal, drupalSettings, once);
