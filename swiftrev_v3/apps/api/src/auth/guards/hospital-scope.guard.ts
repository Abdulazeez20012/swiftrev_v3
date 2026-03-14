import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';

/**
 * HospitalScopeGuard — enforces multi-tenant data isolation.
 *
 * Rules:
 *  - super_admin: allowed to pass any ?hospitalId= query param (cross-hospital access for SwiftRev platform)
 *  - All other roles: the JWT's hospitalId is injected into req.query.hospitalId,
 *    overriding whatever value the client sent. This prevents any hospital user from
 *    accessing another hospital's data by manipulating the query string.
 *  - Non-super_admin with no hospitalId in JWT: rejected with 403.
 *
 * Must be used AFTER JwtAuthGuard so that req.user is already populated.
 */
@Injectable()
export class HospitalScopeGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            // JwtAuthGuard should have rejected before this, but be safe
            throw new ForbiddenException('Unauthenticated');
        }

        // super_admin can query any hospital
        if (user.role === 'super_admin') {
            const requestedHospitalId = request.query?.hospitalId || request.body?.hospitalId || request.body?.hospital_id;
            if (requestedHospitalId) {
                request.user.hospitalId = requestedHospitalId;
            }
            return true;
        }

        const jwtHospitalId: string | undefined = user.hospitalId;

        if (!jwtHospitalId) {
            throw new ForbiddenException(
                'Your account is not linked to a hospital. Please contact an administrator.',
            );
        }

        // Silently override whatever hospitalId the client sent — the JWT is the truth
        request.query = { ...request.query, hospitalId: jwtHospitalId };

        // Also expose on the user object for convenience in controllers
        request.user.hospitalId = jwtHospitalId;

        return true;
    }
}
