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
        const role = user?.role?.toLowerCase();

        console.log(`PermissionsGuard: user=${user?.email}, role=${user?.role}, required=${requiredPermissions}`);

        // Super Admin bypass
        if (role === 'super_admin') {
            return true;
        }

        const userPermissions = user?.permissions || {};

        const hasPermission = requiredPermissions.some((permission) => {
            const [module, action] = permission.split(':');
            const modulePermissions = userPermissions[module];

            console.log(`PermissionsGuard Check: module=${module}, action=${action}, userHas=${JSON.stringify(modulePermissions)}`);

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
