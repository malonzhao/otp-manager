import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

interface TranslationData {
  [key: string]: string | TranslationData;
}

@Injectable()
export class I18nService {
  private translations: { [language: string]: TranslationData } = {};
  private defaultLanguage = "en";

  constructor() {
    this.loadTranslations();
  }

  private loadTranslations() {
    // Try multiple possible paths for locales
    const possiblePaths = [
      path.join(__dirname, "locales"), // Development path
      path.join(process.cwd(), "dist", "src", "i18n", "locales"), // Production path
      path.join(process.cwd(), "src", "i18n", "locales"), // Alternative development path
    ];

    for (const localesPath of possiblePaths) {
      try {
        if (fs.existsSync(localesPath)) {
          const files = fs.readdirSync(localesPath);

          for (const file of files) {
            if (file.endsWith(".json")) {
              const language = file.replace(".json", "");
              const filePath = path.join(localesPath, file);
              const content = fs.readFileSync(filePath, "utf8");
              this.translations[language] = JSON.parse(content);
            }
          }
          console.log(`Translations loaded from: ${localesPath}`);
          return; // Successfully loaded translations
        }
      } catch (error) {
        console.warn(`Failed to load translations from ${localesPath}:`, error);
      }
    }

    // If no translations loaded, create default translations
    console.warn("No translation files found, using default translations");
    this.createDefaultTranslations();
  }

  private createDefaultTranslations() {
    this.translations = {
      en: {
        auth: {
          invalid_credentials: "Invalid email or password",
          email_already_exists: "Email already exists",
          user_not_found: "User not found",
          invalid_token: "Invalid token",
          token_expired: "Token expired",
          password_updated: "Password updated successfully",
          invalid_current_password: "Invalid current password",
          password_too_weak: "Password is too weak",
        },
        platforms: {
          not_found: "Platform not found",
          already_exists: "Platform already exists",
          created: "Platform created successfully",
          updated: "Platform updated successfully",
          deleted: "Platform deleted successfully",
        },
        user_platforms: {
          not_found: "User platform not found",
          already_exists: "User platform already exists",
          created: "User platform created successfully",
          updated: "User platform updated successfully",
          deleted: "User platform deleted successfully",
          invalid_otp: "Invalid OTP code",
        },
        users: {
          not_found: "User not found",
          created: "User created successfully",
          updated: "User updated successfully",
          deleted: "User deleted successfully",
        },
        common: {
          internal_server_error: "Internal server error",
          validation_error: "Validation error",
          unauthorized: "Unauthorized",
          forbidden: "Forbidden",
          not_found: "Resource not found",
        },
      },
      "zh-CN": {
        auth: {
          invalid_credentials: "邮箱或密码错误",
          email_already_exists: "邮箱已存在",
          user_not_found: "用户不存在",
          invalid_token: "无效的令牌",
          token_expired: "令牌已过期",
          password_updated: "密码更新成功",
          invalid_current_password: "当前密码错误",
          password_too_weak: "密码强度不足",
        },
        platforms: {
          not_found: "平台不存在",
          already_exists: "平台已存在",
          created: "平台创建成功",
          updated: "平台更新成功",
          deleted: "平台删除成功",
        },
        user_platforms: {
          not_found: "用户平台不存在",
          already_exists: "用户平台已存在",
          created: "用户平台创建成功",
          updated: "用户平台更新成功",
          deleted: "用户平台删除成功",
          invalid_otp: "无效的OTP验证码",
        },
        users: {
          not_found: "用户不存在",
          created: "用户创建成功",
          updated: "用户更新成功",
          deleted: "用户删除成功",
        },
        common: {
          internal_server_error: "服务器内部错误",
          validation_error: "验证错误",
          unauthorized: "未授权",
          forbidden: "禁止访问",
          not_found: "资源不存在",
        },
      },
      "zh-TW": {
        auth: {
          invalid_credentials: "電子郵件或密碼錯誤",
          email_already_exists: "電子郵件已存在",
          user_not_found: "用戶不存在",
          invalid_token: "無效的令牌",
          token_expired: "令牌已過期",
          password_updated: "密碼更新成功",
          invalid_current_password: "當前密碼錯誤",
          password_too_weak: "密碼強度不足",
        },
        platforms: {
          not_found: "平台不存在",
          already_exists: "平台已存在",
          created: "平台創建成功",
          updated: "平台更新成功",
          deleted: "平台刪除成功",
        },
        user_platforms: {
          not_found: "用戶平台不存在",
          already_exists: "用戶平台已存在",
          created: "用戶平台創建成功",
          updated: "用戶平台更新成功",
          deleted: "用戶平台刪除成功",
          invalid_otp: "無效的OTP驗證碼",
        },
        users: {
          not_found: "用戶不存在",
          created: "用戶創建成功",
          updated: "用戶更新成功",
          deleted: "用戶刪除成功",
        },
        common: {
          internal_server_error: "伺服器內部錯誤",
          validation_error: "驗證錯誤",
          unauthorized: "未授權",
          forbidden: "禁止訪問",
          not_found: "資源不存在",
        },
      },
    };
  }

  translate(key: string, language?: string): string {
    const lang = language || this.defaultLanguage;
    const keys = key.split(".");

    let value: any =
      this.translations[lang] || this.translations[this.defaultLanguage];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Fallback to default language
        value = this.translations[this.defaultLanguage];
        for (const k2 of keys) {
          if (value && typeof value === "object" && k2 in value) {
            value = value[k2];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }

    return typeof value === "string" ? value : key;
  }

  getSupportedLanguages(): string[] {
    return Object.keys(this.translations);
  }

  setDefaultLanguage(language: string) {
    if (this.translations[language]) {
      this.defaultLanguage = language;
    }
  }
}
