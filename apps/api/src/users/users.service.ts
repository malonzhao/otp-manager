import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { CreateUserDto } from "./dto/create-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import * as bcrypt from "bcrypt";
import { User } from '../../generated/prisma';
import { I18nService } from "../i18n/i18n.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly i18nService: I18nService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.usersRepository.findAll(),
      this.usersRepository.count(),
    ]);

    return {
      users: users.slice(skip, skip + limit),
      total,
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(
        this.i18nService.translate("users.not_found"),
      );
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingEmail = await this.usersRepository.findByEmail(
      createUserDto.email,
    );
    if (existingEmail) {
      throw new ConflictException(
        this.i18nService.translate("auth.email_already_exists"),
      );
    }

    const existingUsername = await this.usersRepository.findByUsername(
      createUserDto.username,
    );
    if (existingUsername) {
      throw new ConflictException(
        this.i18nService.translate("auth.email_already_exists"),
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.usersRepository.create({
      email: createUserDto.email,
      username: createUserDto.username,
      password: hashedPassword,
      isActive: createUserDto.isActive,
    });
  }

  async update(id: string, updateData: Partial<CreateUserDto>): Promise<User> {
    const user = await this.findById(id);

    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await this.usersRepository.findByEmail(
        updateData.email,
      );
      if (existingEmail) {
        throw new ConflictException(
          this.i18nService.translate("auth.email_already_exists"),
        );
      }
    }

    if (updateData.username && updateData.username !== user.username) {
      const existingUsername = await this.usersRepository.findByUsername(
        updateData.username,
      );
      if (existingUsername) {
        throw new ConflictException(
          this.i18nService.translate("auth.email_already_exists"),
        );
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return this.usersRepository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.delete(id);
  }

  async activateUser(id: string): Promise<User> {
    await this.findById(id);
    return this.usersRepository.activateUser(id);
  }

  async deactivateUser(id: string): Promise<User> {
    await this.findById(id);
    return this.usersRepository.deactivateUser(id);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    // Validate that new password and confirm password match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException(
        this.i18nService.translate("auth.password_too_weak"),
      );
    }

    // Get current user
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(
        this.i18nService.translate("users.not_found"),
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException(
        this.i18nService.translate("auth.invalid_current_password"),
      );
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        this.i18nService.translate("auth.password_too_weak"),
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    // Update password
    await this.usersRepository.update(userId, {
      password: hashedNewPassword,
    });
  }
}
