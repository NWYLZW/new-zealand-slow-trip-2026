// GitHub Pages has no SPA rewrite rule. Emit aliases from the one transformed shell.
export function staticAppRoutes() {
  return {
    name: "static-app-routes",
    enforce: "post",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const shell = bundle["index.html"];
        if (!shell || shell.type !== "asset") throw new Error("Missing application shell");
        for (const fileName of ["v1/index.html", "v1.html", "adventure/index.html", "adventure.html"]) {
          this.emitFile({ type: "asset", fileName, source: shell.source });
        }
      },
    },
  };
}
