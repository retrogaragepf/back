import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({
  name: 'MatchPassword',
  async: false,
})
export class MatchPassword implements ValidatorConstraintInterface {
  validate(
    confirmPassword: string,
    args: ValidationArguments,
  ): Promise<boolean> | boolean {
    console.log(args);
    const obj = args.object as Record<string, unknown>;
    const key = args.constraints[0];
    const password = obj[key];
    if (confirmPassword !== password) {
      return false;
    }
    return true;
  }
  defaultMessage(): string {
    return 'El password y la confirmación no coinciden';
  }
}
