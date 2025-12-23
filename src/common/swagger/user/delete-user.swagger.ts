import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ApiSecuritySwagger,
  ApiUnauthorizedResponseSwagger,
} from '../api-utils.swagger';

export function DeleteUserSwagger() {
  return applyDecorators(
    ApiSecuritySwagger(),
    ApiOperation({
      summary: 'User Logout',
      description: 'User Logout and delete token',
    }),
    ApiResponse({
      status: 200,
      description: 'Successful Logout',
      example: { data: 'True' },
    }),
    ApiUnauthorizedResponseSwagger(),
  );
}
