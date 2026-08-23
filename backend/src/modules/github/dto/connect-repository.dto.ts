import { IsNotEmpty, IsString } from "class-validator";

export class ConnectRepositoryDto {
  @IsString()
  @IsNotEmpty()
  owner!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
