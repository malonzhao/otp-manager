import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from "@nestjs/common";
import { UserPlatformsService } from "./user-platforms.service";
import { CreateUserPlatformDto } from "./dto/create-user-platform.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import type { TokenPayload } from "../auth/interfaces/token-payload.interface";

@Controller("user-platforms")
@UseGuards(JwtAuthGuard)
export class UserPlatformsController {
  constructor(private readonly userPlatformsService: UserPlatformsService) {}

  @Get()
  async findAll(
    @GetUser() user: TokenPayload,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
  ) {
    return this.userPlatformsService.findAllByUserId(
      user.sub,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @GetUser() user: TokenPayload) {
    return this.userPlatformsService.findById(id, user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserPlatformDto: CreateUserPlatformDto,
    @GetUser() user: TokenPayload,
  ) {
    return this.userPlatformsService.create(user.sub, createUserPlatformDto);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateData: Partial<CreateUserPlatformDto>,
    @GetUser() user: TokenPayload,
  ) {
    return this.userPlatformsService.update(id, user.sub, updateData);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string, @GetUser() user: TokenPayload) {
    return this.userPlatformsService.delete(id, user.sub);
  }

  @Post(":id/otp")
  @HttpCode(HttpStatus.OK)
  async generateOTP(@Param("id") id: string, @GetUser() user: TokenPayload) {
    return this.userPlatformsService.generateOTP(id, user.sub);
  }
}
