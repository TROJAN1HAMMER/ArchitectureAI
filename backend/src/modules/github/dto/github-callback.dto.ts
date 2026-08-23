import { IsNotEmpty, IsString } from "class-validator";

export class GithubCallbackDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;
}
