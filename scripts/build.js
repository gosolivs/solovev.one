const path = require("path");
const { readFile, writeFile, copyFile, unlink, rmdir } = require("fs").promises;

const Parcel = require("parcel-bundler");

const PostHTML = require("posthtml");
const PostHTMLMinifyCSS = require("posthtml-minify-classnames");
const HTMLNano = require("htmlnano");

const PostCSS = require("postcss");
const MQPacker = require("css-mqpacker");

const sourcePath = path.join(process.cwd(), "src", "pages");
const pages = ["index", "404"]

const mainBundler = new Parcel(
  pages.map((p) => path.join(sourcePath, p, `${p}.pug`)),
  {
    sourceMaps: false,
    scopeHoist: true,
  }
);

async function build() {
  const bundlePages = await mainBundler.bundle();
  const assets = findAssets(bundlePages);
  const cssFiles = assets.filter((item) => item.type === "css");

  for (const cssFile of cssFiles) {
    /**
     * @type {Buffer}
     */
    const cssData = await readFile(cssFile.name);

    /**
     * @type {postcss.Result}
     */
    const styles = await PostCSS([MQPacker]).process(cssData, {
      from: cssFile.name,
    });

    /**
     * @type {string}
     */
    cssFile.css = styles.css;
  }

  for (const item of assets.filter((i) => i.type === "html")) {
    /**
     * @type {string}
     */
    const html = await readFile(item.name).then((i) => i.toString());

    /**
     * @type {PostHTML.Result<unknown>}
     */
    const result = await PostHTML()
      .use(inlineStylesPlugin(cssFiles))
      .use(PostHTMLMinifyCSS())
      .use(HTMLNano({ removeUnusedCss: {} }))
      .process(html);

    await writeFile(
      path.join(path.dirname(item.name), "..", path.basename(item.name)),
      result.html
    );

    await rmdir(path.dirname(item.name), { recursive: true, force: true });
  }

  await copyFile("./src/icons/favicon.ico", "./dist/favicon.ico");

  for (const cssFile of cssFiles) {
    await unlink(cssFile.name);
  }
}

build().catch((error) => {
  process.stderr.write(error.stack + "\n");
  process.exit(1);
});

/**
 * @param bundle {Bundle}
 * @returns {{ name: string, type: string }[]}
 */
function findAssets(bundle) {
  return Array.from(bundle.childBundles).reduce(
    (all, item) => all.concat(findAssets(item)),
    [
      {
        name: bundle.name,
        type: bundle.type,
      },
    ]
  );
}

function inlineStylesPlugin(cssFiles) {
  return (tree) => {
    tree.match({ tag: "link", attrs: { rel: "stylesheet" } }, (link) => {
      const cssFile = cssFiles.find(
        (item) => item.name.indexOf(link.attrs.href) >= 0
      );

      return {
        tag: "style",
        content: cssFile.css,
      };
    });
  };
}
