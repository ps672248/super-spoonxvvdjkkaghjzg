import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://aspirant-arcade.xyz',
      lastModified: new Date('2026-06-19'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://aspirant-arcade.xyz/download',
      lastModified: new Date('2026-06-19'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://aspirant-arcade.xyz/demo',
      lastModified: new Date('2026-06-19'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
