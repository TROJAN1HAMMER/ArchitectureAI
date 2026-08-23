import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({
    example: "user@example.com",
    description: "User email address",
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: "password123",
    description: "User password (minimum 8 characters)",
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: "Jane Doe", description: "User full name" })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
