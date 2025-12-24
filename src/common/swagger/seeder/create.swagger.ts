import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ApiForbiddenResponseSwagger,
  ApiSecuritySwagger,
  ApiUnauthorizedResponseSwagger,
} from '../api-utils.swagger';

export function CreateSeederSwagger() {
  return applyDecorators(
    ApiSecuritySwagger(),
    ApiOperation({
      summary: 'Create Seeder',
      description: 'Create seeder.',
    }),
    ApiResponse({
      status: 200,
      description: 'Seeder created successfully',
      example: {
        message: 'Seeder completed successfully',
        count: 2,
        usernames: ['john', 'doe'],
      },
    }),
    ApiForbiddenResponseSwagger(),
    ApiUnauthorizedResponseSwagger(),
  );
}
