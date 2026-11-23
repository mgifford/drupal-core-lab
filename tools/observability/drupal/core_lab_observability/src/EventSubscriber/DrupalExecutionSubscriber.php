<?php

declare(strict_types=1);

namespace Drupal\core_lab_observability\EventSubscriber;

use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\core_lab_observability\Tracer;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ControllerArgumentsEvent;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Connects Drupal's HTTP kernel events to the tracer.
 *
 * Every call is wrapped: observability must never change whether a Drupal
 * request succeeds. A tracing error is logged and the request continues.
 */
final class DrupalExecutionSubscriber implements EventSubscriberInterface {

  public function __construct(
    private readonly Tracer $tracer,
    private readonly LoggerChannelInterface $logger,
  ) {}

  public static function getSubscribedEvents(): array {
    return [
      // After Symfony's RouterListener (priority 32), so the route is known.
      KernelEvents::REQUEST => ['onRequest', 0],
      KernelEvents::CONTROLLER_ARGUMENTS => ['onControllerArguments', 0],
      KernelEvents::VIEW => ['onView', 0],
      KernelEvents::RESPONSE => ['onResponse', 0],
      KernelEvents::TERMINATE => ['onTerminate', 0],
      KernelEvents::EXCEPTION => ['onException', 0],
    ];
  }

  public function onRequest(RequestEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }
    $this->guard('request', fn () => $this->tracer->onRequest($event->getRequest()));
  }

  public function onControllerArguments(ControllerArgumentsEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }
    $this->guard('controller', fn () => $this->tracer->onControllerArguments());
  }

  public function onView(ViewEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }
    $this->guard('view', fn () => $this->tracer->onView());
  }

  public function onResponse(ResponseEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }
    $this->guard('response', fn () => $this->tracer->onResponse($event->getResponse()));
  }

  public function onTerminate(TerminateEvent $event): void {
    $this->guard('terminate', fn () => $this->tracer->onTerminate());
  }

  public function onException(ExceptionEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }
    $this->guard('exception', fn () => $this->tracer->onException($event->getThrowable()));
  }

  private function guard(string $where, callable $call): void {
    try {
      $call();
    }
    catch (\Throwable $e) {
      $this->logger->warning('Core Lab observability failed in @where: @message', [
        '@where' => $where,
        '@message' => $e->getMessage(),
      ]);
    }
  }

}
