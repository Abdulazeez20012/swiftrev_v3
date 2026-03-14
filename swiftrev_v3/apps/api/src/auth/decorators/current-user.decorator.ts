import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() — extracts the authenticated user from the JWT-validated request.
 *
 * Usage:
 *   findAll(@CurrentUser() user: JwtUser) { ... }
 *
 * Available fields (from JwtStrategy.validate):
 *   user.userId    — the user's UUID
 *   user.email     — the user's email
 *   user.role      — the user's role name (e.g. 'hospital_admin', 'super_admin')
 *   user.hospitalId — the hospital this user belongs to (enforced by HospitalScopeGuard)
 *   user.permissions — role permissions object
 */
export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
