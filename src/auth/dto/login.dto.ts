import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { SomaliPhone } from '../../common/validators/somali-phone.validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @SomaliPhone()
  phone: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
