// Sitemap generation script with database integration
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import { JSXAttribute, JSXIdentifier, JSXOpeningElement } from "@babel/types";
import { createClient } from "@supabase/supabase-js";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ———————————————
// CONFIGURATION
// ———————————————

const BASE_URL = "https://fasterfollow.net";
const ROUTER_FILE_PATH = path.resolve(__dirname, "../App.tsx");
const OUTPUT_DIR = path.resolve(__dirname, "../../public");
const SITEMAP_PATH = path.join(OUTPUT_DIR, "sitemap.xml");

// PATHS TO IGNORE
const IGNORE_PATHS: string[] = [
  "/auth",
  "/admin/*",
  "/dashboard/*",
  "/admin-auth",
];

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://jljizjuzliucwcvzrtkr.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsaml6anV6bGl1Y3djdnpydGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzU1NzgsImV4cCI6MjA4MjYxMTU3OH0.mMa5TJECLsLSycO8fJrHf2jOPwpjTDDZCygYQVMbuIQ";

// ———————————————
// HELPER FUNCTIONS
// ———————————————

function formatDate(dateString?: string): string {
  try {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getAttributeValue(
  astPath: NodePath<JSXOpeningElement>,
  attributeName: string
): string | null {
  const attribute = astPath.node.attributes.find(
    (attr): attr is JSXAttribute =>
      attr.type === "JSXAttribute" && attr.name.name === attributeName
  );

  if (!attribute) {
    return null;
  }

  const value = attribute.value;
  if (value?.type === "StringLiteral") {
    return value.value;
  }
  return null;
}

function joinPaths(paths: string[]): string {
  if (paths.length === 0) return "/";

  const joined = paths.join("/");
  const cleaned = ("/" + joined).replace(/\/+/g, "/");

  if (cleaned.length > 1 && cleaned.endsWith("/")) {
    return cleaned.slice(0, -1);
  }

  return cleaned;
}

function shouldIgnoreRoute(route: string): boolean {
  for (const ignorePattern of IGNORE_PATHS) {
    if (ignorePattern === route) {
      return true;
    }

    if (ignorePattern.endsWith("/*")) {
      const prefix = ignorePattern.slice(0, -2);
      if (route.startsWith(prefix + "/") || route === prefix) {
        return true;
      }
    }
  }

  return false;
}

// ———————————————
// SITEMAP GENERATION
// ———————————————

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

function createSitemapXml(urls: SitemapUrl[]): string {
  const urlElements = urls
    .map((url) => {
      return `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>
`;
}

async function generateSitemap() {
  console.log("🚀 Generating sitemap...");

  if (!BASE_URL.startsWith("http")) {
    console.error(
      'Error: BASE_URL must be a full URL (e.g., "https://example.com")'
    );
    process.exit(1);
  }

  const allUrls: SitemapUrl[] = [];
  const today = formatDate();

  // 1. Parse App.tsx for static routes
  console.log("📖 Parsing routes from App.tsx...");
  const content = fs.readFileSync(ROUTER_FILE_PATH, "utf-8");

  const ast = parser.parse(content, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  const pathStack: string[] = [];
  const foundRoutes: string[] = [];

  traverse(ast, {
    JSXOpeningElement: {
      enter(astPath) {
        const nodeName = astPath.node.name as JSXIdentifier;
        if (nodeName.name !== "Route") return;

        const pathProp = getAttributeValue(astPath, "path");
        const hasElement = astPath.node.attributes.some(
          (attr) => attr.type === "JSXAttribute" && attr.name.name === "element"
        );

        if (pathProp) {
          pathStack.push(pathProp);
        }

        if (hasElement && pathProp) {
          const fullRoute = joinPaths(pathStack);
          foundRoutes.push(fullRoute);
        }
      },

      exit(astPath) {
        const nodeName = astPath.node.name as JSXIdentifier;
        if (nodeName.name !== "Route") return;

        const pathProp = getAttributeValue(astPath, "path");
        if (pathProp) {
          pathStack.pop();
        }
      },
    },
  });

  // Filter static routes
  const staticRoutes = foundRoutes.filter(
    (route) => !route.includes(":") && !route.includes("*")
  );

  const filteredRoutes = staticRoutes.filter(
    (route) => !shouldIgnoreRoute(route)
  );

  console.log(`  Found ${filteredRoutes.length} static routes`);

  // Add static routes with appropriate priorities
  for (const route of filteredRoutes) {
    let priority = "0.8";
    let changefreq = "weekly";

    if (route === "/") {
      priority = "1.0";
      changefreq = "daily";
    } else if (route === "/services") {
      priority = "0.9";
      changefreq = "daily";
    } else if (route === "/blog") {
      priority = "0.8";
      changefreq = "daily";
    }

    allUrls.push({
      loc: BASE_URL + route,
      lastmod: today,
      changefreq,
      priority,
    });
  }

  // 2. Fetch services from database
  console.log("📦 Fetching services from database...");
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("slug, updated_at, is_indexable")
      .eq("is_active", true)
      .eq("is_archived", false)
      .order("sort_order", { ascending: true });

    if (servicesError) {
      console.error("  Error fetching services:", servicesError.message);
    } else if (services) {
      const indexableServices = services.filter((s) => s.is_indexable !== false);
      console.log(`  Found ${indexableServices.length} indexable services`);

      for (const service of indexableServices) {
        allUrls.push({
          loc: `${BASE_URL}/services/${service.slug}`,
          lastmod: formatDate(service.updated_at),
          changefreq: "weekly",
          priority: "0.8",
        });
      }
    }

    // 3. Fetch blog posts
    console.log("📝 Fetching blog posts from database...");
    const { data: blogPosts, error: blogError } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, is_indexable")
      .eq("status", "published")
      .eq("is_archived", false)
      .order("published_at", { ascending: false });

    if (blogError) {
      console.error("  Error fetching blog posts:", blogError.message);
    } else if (blogPosts) {
      const indexablePosts = blogPosts.filter((p) => p.is_indexable !== false);
      console.log(`  Found ${indexablePosts.length} indexable blog posts`);

      for (const post of indexablePosts) {
        allUrls.push({
          loc: `${BASE_URL}/blog/${post.slug}`,
          lastmod: formatDate(post.updated_at),
          changefreq: "monthly",
          priority: "0.7",
        });
      }
    }

    // 4. Fetch pages
    console.log("📄 Fetching pages from database...");
    const { data: pages, error: pagesError } = await supabase
      .from("pages")
      .select("slug, updated_at, is_indexable")
      .eq("is_published", true)
      .eq("is_archived", false);

    if (pagesError) {
      console.error("  Error fetching pages:", pagesError.message);
    } else if (pages) {
      const indexablePages = pages.filter((p) => p.is_indexable !== false);
      console.log(`  Found ${indexablePages.length} indexable pages`);

      for (const page of indexablePages) {
        allUrls.push({
          loc: `${BASE_URL}/page/${page.slug}`,
          lastmod: formatDate(page.updated_at),
          changefreq: "monthly",
          priority: "0.6",
        });
      }
    }
  } catch (error) {
    console.error("  Database connection error:", error);
  }

  // 5. Generate the XML
  console.log(`\n📊 Total URLs in sitemap: ${allUrls.length}`);
  const sitemapXml = createSitemapXml(allUrls);

  // 6. Write the sitemap.xml file
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(SITEMAP_PATH, sitemapXml);

  console.log(`✅ Sitemap successfully generated at ${SITEMAP_PATH}`);
}

// Run the script
generateSitemap().catch(console.error);
