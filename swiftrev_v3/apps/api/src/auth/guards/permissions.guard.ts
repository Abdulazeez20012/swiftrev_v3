import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        // Super Admin bypass
        if (user.role === 'super_admin') {
            return true;
        }

        const userPermissions = user.permissions || {};

        // Check if user has required permissions
        // This is a basic implementation, can be expanded for complex JSON nested permissions
        const hasPermission = requiredPermissions.every((permission) => {
            const [module, action] = permission.split(':');
            const modulePermissions = userPermissions[module];

            if (Array.isArray(modulePermissions)) {
                return modulePermissions.includes(action) || modulePermissions.includes('all');
            }

            return modulePermissions === true || modulePermissions === 'all';
        });

        if (!hasPermission) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
