import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { SomaliPhone } from '../../common/validators/somali-phone.validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  businessName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  ownerName: string;

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
