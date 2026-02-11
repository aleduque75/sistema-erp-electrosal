// import { Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { Role } from '@prisma/client';
// import { PermissionsService } from '../permissions/permissions.service';

// @Injectable()
// export class RolesService {
//   constructor(
//     private prisma: PrismaService,
//     private permissionsService: PermissionsService,
//   ) {}

//   async create(
//     organizationId: string,
//     name: string,
//     description?: string,
//     permissionNames?: string[],
//   ): Promise<Role> {
//     const data: any = {
//       organization: { connect: { id: organizationId } },
//       name,
//       description,
//     };

//     if (permissionNames && permissionNames.length > 0) {
//       const permissions = await this.prisma.permission.findMany({
//         where: { name: { in: permissionNames } },
//       });

//       if (permissions.length !== permissionNames.length) {
//         throw new NotFoundException('One or more permission names are invalid.');
//       }
//       data.permissions = {
//         connect: permissions.map((p) => ({ id: p.id })),
//       };
//     }

//     return this.prisma.role.create({ data });
//   }

//   async findAll(organizationId: string): Promise<Role[]> {
//     return this.prisma.role.findMany({
//       where: { organizationId },
//       include: { permissions: true },
//     });
//   }

//   async findOne(organizationId: string, id: string): Promise<Role | null> {
//     return this.prisma.role.findUnique({
//       where: { id, organizationId },
//       include: { permissions: true },
//     });
//   }

//   async update(
//     organizationId: string,
//     id: string,
//     name?: string,
//     description?: string,
//     permissionNames?: string[],
//   ): Promise<Role> {
//     const data: any = { name, description };

//     if (permissionNames !== undefined) {
//       const permissions = await this.prisma.permission.findMany({
//         where: { name: { in: permissionNames } },
//       });

//       if (permissions.length !== permissionNames.length) {
//         throw new NotFoundException('One or more permission names are invalid.');
//       }

//       data.permissions = {
//         set: permissions.map((p) => ({ id: p.id })), // Disconnect existing and connect new
//       };
//     }

//     return this.prisma.role.update({
//       where: { id, organizationId },
//       data,
//       include: { permissions: true },
//     });
//   }

//   async remove(organizationId: string, id: string): Promise<Role> {
//     // Before deleting a role, you might want to consider how to handle users
//     // who are currently assigned to this role.
//     // For now, let's assume they will just lose this role.
//     return this.prisma.role.delete({ where: { id, organizationId } });
//   }

//   async assignRoleToUser(userId: string, roleId: string): Promise<void> {
//     await this.prisma.user.update({
//       where: { id: userId },
//       data: {
//         roles: {
//           connect: { id: roleId },
//         },
//       },
//     });
//   }

//   async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
//     await this.prisma.user.update({
//       where: { id: userId },
//       data: {
//         roles: {
//           disconnect: { id: roleId },
//         },
//       },
//     });
//   }
// }
