# Local collector

`otel-collector-config.yaml` is copied into each environment's `observability/` directory by
`node tools/observability/cli.mjs enable <slug>`. The DDEV compose file adds one collector container to that
environment's project network, so Drupal reaches it at `http://otel-collector:4318` and the collector never sees
traffic from the other side.

The image is pinned to `otel/opentelemetry-collector-contrib:0.165.0`. The collector is not started by
`tools/compare/setup.mjs` or `scripts/lab-env.mjs`; observability is opt-in.

The collector writes OTLP JSON lines to `envs/<env>/observability/data/traces.jsonl`. The lab's collector script reads
that file only to count which trace ids were exported; the durable evidence is the module's local span file and the
request summary, both sanitised before they are copied into `reports/`.

To inspect the collector while a comparison is running:

```bash
cd envs/baseline-main
ddev logs -f otel-collector
```

To check the OTLP endpoint from the web container:

```bash
cd envs/baseline-main
ddev exec sh -c 'curl -s -o /dev/null -w "%{http_code}" http://otel-collector:4318/v1/traces'
```

`405` is expected for a GET: the endpoint accepts POST only.
