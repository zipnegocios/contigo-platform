import { z } from 'zod'

const ButtonSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(100),
  style: z.enum(['primary', 'secondary']),
  linkType: z.enum(['custom', 'service', 'project', 'scroll', 'form']),
  href: z.string(),
  scrollTarget: z.string().optional(),
  entityId: z.string().optional(),
  entityLabel: z.string().optional(),
  formId: z.string().optional(),
  formSlug: z.string().optional(),
  formName: z.string().optional(),
})

const VideoSettingsSchema = z
  .object({
    autoplay: z.boolean(),
    loop: z.boolean(),
    startTime: z.number().min(0).optional(),
    endTime: z.number().positive().optional(),
    playbackRate: z.number().min(0.5).max(2),
    objectPosition: z.string().max(40),
    audio: z.enum(['off', 'muted_toggle', 'on']),
  })
  .refine((v) => v.endTime === undefined || v.endTime > (v.startTime ?? 0), {
    message: 'endTime must be greater than startTime',
  })

const MediaSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string(),
  posterUrl: z.string().optional(),
  video: VideoSettingsSchema.optional(),
})

const SlideSchema = z.object({
  id: z.string(),
  desktopImageUrl: z.string(),
  mobileImageUrl: z.string().optional(),
  desktopMedia: MediaSchema.optional(),
  mobileMedia: MediaSchema.optional(),
  headline: z.string(),
  subtitle: z.string().optional(),
  eyebrow: z.string().optional(),
  buttons: z.array(ButtonSchema),
})

export const HeroConfigInputSchema = z.object({
  mode: z.enum(['single', 'slider']),
  headline: z.string(),
  subtitle: z.string().optional(),
  eyebrow: z.string().optional(),
  desktopImageUrl: z.string().optional(),
  mobileImageUrl: z.string().optional(),
  desktopMedia: MediaSchema.optional(),
  mobileMedia: MediaSchema.optional(),
  buttons: z.array(ButtonSchema),
  slides: z.array(SlideSchema),
  autoplayInterval: z.number().int().min(1000).max(30000),
  overlayOpacity: z.number().int().min(0).max(100),
})
