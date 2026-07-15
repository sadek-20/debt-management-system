import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

export const SOMALI_PHONE_PATTERN = /^(?:\+252|00252|0)?[0-9]{9}$/;

@ValidatorConstraint({ name: 'SomaliPhone', async: false })
export class SomaliPhoneValidator implements ValidatorConstraintInterface {
  validate(value: unknown, _args: ValidationArguments): boolean {
    return typeof value === 'string' && SOMALI_PHONE_PATTERN.test(value);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'phone must be a valid Somali phone number';
  }
}

export function SomaliPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: SomaliPhoneValidator,
    });
  };
}
