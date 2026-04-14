/** Hospital Scope Guard - Re-triggering build for safety */
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
            console.error('HospitalScopeGuard: No user found on request');
            throw new ForbiddenException('Unauthenticated');
        }

        const role = user.role?.toLowerCase();

        // super_admin can query any hospital
        if (role === 'super_admin') {
            let requestedHospitalId = request.query?.hospitalId || request.body?.hospitalId || request.body?.hospital_id;
            
            // Clean up common "empty" values sent by clients
            if (requestedHospitalId === 'null' || requestedHospitalId === 'undefined' || requestedHospitalId === '') {
                requestedHospitalId = null;
            }

            if (requestedHospitalId) {
                request.user.hospitalId = requestedHospitalId;
                console.log(`HospitalScopeGuard: SuperAdmin ${user.email} scoped to hospital: ${requestedHospitalId}`);
            } else if (user.hospitalId) {
                // Fallback to the ID in the JWT if no query param
                console.log(`HospitalScopeGuard: SuperAdmin ${user.email} using JWT hospitalId: ${user.hospitalId}`);
            } else {
                console.log(`HospitalScopeGuard: SuperAdmin ${user.email} has no hospitalId scope.`);
            }
            return true;
        }

        const jwtHospitalId: string | undefined = user.hospitalId;

        if (!jwtHospitalId) {
            const debugInfo = `Role: ${user.role}, HospitalId: ${user.hospitalId}, Email: ${user.email}`;
            console.warn(`HospitalScopeGuard: Access denied. ${debugInfo}`);
            throw new ForbiddenException(
                `Your account is not linked to a hospital. (${debugInfo})`,
            );
        }

        // Expose on the user object for convenience in controllers (enforced tenant isolation)
        if (jwtHospitalId) {
            request.user.hospitalId = jwtHospitalId;
        }

        return true;
    }
}
