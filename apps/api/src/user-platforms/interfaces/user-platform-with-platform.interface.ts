import { UserPlatform, Platform } from '@prisma/client';

export interface UserPlatformWithPlatform extends UserPlatform {
  platform: Platform;
}