import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Email format is incorrect" })
  @IsNotEmpty({ message: "Email cannot be empty" })
  email!: string;

  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password cannot be empty" })
  @MinLength(8, { message: "Password length cannot be less than 8 characters" })
  password!: string;
}
