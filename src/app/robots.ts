import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://myhipa.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/search",
          "/stores",
          "/store/",
          "/product/",
          "/sellers",
          "/new-arrivals",
          "/community",
          "/about",
          "/artisan-stories",
          "/regional-collections",
          "/advertising",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/seller/",
          "/dashboard/",
          "/cart/",
          "/checkout/",
          "/login/",
          "/signup/",
          "/profile/",
          "/settings/",
          "/messages/",
          "/transactions/",
          "/deposit/",
          "/recently-viewed/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/seller/",
          "/dashboard/",
          "/cart/",
          "/checkout/",
          "/login/",
          "/signup/",
          "/messages/",
          "/transactions/",
          "/deposit/",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/seller/",
          "/dashboard/",
          "/cart/",
          "/checkout/",
          "/login/",
          "/signup/",
          "/messages/",
          "/transactions/",
          "/deposit/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
