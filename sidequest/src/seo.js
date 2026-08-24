import { useEffect } from "react";

const SITE_URL = "https://sidequest-7e53.netlify.app";

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    const [, key, val] = selector.match(/\[(.+?)=["']?(.+?)["']?\]/) || [];
    if (key && val) el.setAttribute(key, val);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setCanonical(path) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", `${SITE_URL}${path}`);
}

/**
 * Lightweight per-route SEO for the SPA. Updates <title>, description, canonical,
 * and the key Open Graph / Twitter fields so shared links and app pages read well.
 */
export function usePageMeta({ title, description, path = "/", image = "/marketing/sq_og.jpg" }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
      setMeta('meta[name="twitter:description"]', "content", description);
    }
    if (title) {
      setMeta('meta[property="og:title"]', "content", title);
      setMeta('meta[name="twitter:title"]', "content", title);
    }
    const absImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;
    setMeta('meta[property="og:image"]', "content", absImage);
    setMeta('meta[name="twitter:image"]', "content", absImage);
    setMeta('meta[property="og:url"]', "content", `${SITE_URL}${path}`);
    setCanonical(path);
  }, [title, description, path, image]);
}
