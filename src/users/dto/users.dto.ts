import { ApiHideProperty, PickType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEmpty,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { MatchPassword } from 'src/decorators/matchpassword.decorator';

export class CreateUserDto {
  /**
   * Debe ser un string de entre 3 y 80 caracteres
   * @example 'Demo'
   */
  @IsNotEmpty({ message: 'Nombre no puede estar vacío' })
  @IsString({ message: 'Nombre debe ser un string' })
  @MinLength(3, { message: 'Nombre de al menos 3 caracteres' })
  @MaxLength(80, { message: 'Nombre de máximo 80 caracteres' })
  name: string;

  /**
   * Debe ser un string de entre 3 y 80 caracteres
   * @example 'demo@mail.com'
   */
  @IsNotEmpty({ message: 'Email no puede estar vacío' })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  /**
   * Debe ser un string de entre 3 y 80 caracteres
   * @example 'Demo123*'
   */
  @IsNotEmpty({ message: 'Contraseña no puede estar vacío' })
  @IsString({ message: 'Password debe ser un string' })
  @IsStrongPassword(
    {
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Contraseña debe tener al menos una minúscula, una mayúscula, un número y un símbolo: !@#$%^&*',
    },
  )
  password: string;

  /**
   * Debe ser un string de entre 3 y 80 caracteres
   * @example 'Demo123*'
   */
  @IsNotEmpty()
  @Validate(MatchPassword, ['password'])
  confirmPassword: string;

  @ApiHideProperty()
  @IsEmpty()
  isAdmin: boolean;
}

export class LoginUserDto extends PickType(CreateUserDto, [
  'email',
  'password',
]) {}

export class UpdateUserDto {
  address: String;
  phone: string;
  city: string;
  country: string;
}
