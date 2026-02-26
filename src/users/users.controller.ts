import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Users } from './entities/users.entity';
import { UpdateMyAvatarDto, UpdateUserDto } from './dto/users.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from './roles.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  // =========================================
  // ADMIN - OBTENER TODOS LOS USUARIOS
  // =========================================

  @ApiBearerAuth()
  @Get()
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Obtener todos los usuarios (Admin)',
    description: 'Devuelve la lista completa de usuarios. Requiere rol ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({ description: 'No tiene permisos de administrador' })
  async getAllUsers() {
    const users = await this.userService.getAllUsers();
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.isAdmin ? 'Admin' : 'User',
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    }));
  }

  // =========================================
  // PERFIL DEL USUARIO AUTENTICADO
  // =========================================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({
    summary: 'Obtener mi perfil',
    description: 'Devuelve la información del usuario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o ausente' })
  async getProfile(@Req() req) {
    return this.userService.getUserById(req.user.id);
  }

  // =========================================
  // OBTENER USUARIO POR ID
  // =========================================

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description:
      'Devuelve un usuario por su ID (sin password ni datos sensibles).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario',
  })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Omit<Users, 'password' | 'isAdmin'>> {
    return this.userService.getUserById(id);
  }

  // =========================================
  // ACTUALIZAR USUARIO
  // =========================================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Actualiza los datos de un usuario por ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado correctamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserData: UpdateUserDto,
  ) {
    return await this.userService.updateUser(id, updateUserData);
  }

  // =========================================
  // ACTUALIZAR MI AVATAR
  // =========================================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  @ApiOperation({
    summary: 'Actualizar mi avatar',
    description:
      'Permite al usuario autenticado actualizar su imagen de perfil.',
  })
  @ApiResponse({ status: 200, description: 'Avatar actualizado correctamente' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  async updateMyAvatar(@Req() req, @Body() avatarData: UpdateMyAvatarDto) {
    return await this.userService.updateMyAvatar(req.user.id, avatarData);
  }

  // =========================================
  // ADMIN - ELIMINAR USUARIO
  // =========================================

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar usuario (Admin)',
    description: 'Elimina un usuario del sistema. Requiere rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario',
  })
  @ApiResponse({ status: 200, description: 'Usuario eliminado correctamente' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  @ApiForbiddenResponse({ description: 'No tiene permisos de administrador' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.deleteUser(id);
  }

  // =========================================
  // ADMIN - BLOQUEAR USUARIO
  // =========================================

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/block')
  @ApiOperation({
    summary: 'Bloquear usuario (Admin)',
    description: 'Bloquea un usuario e impide su acceso al sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario',
  })
  @ApiResponse({ status: 200, description: 'Usuario bloqueado correctamente' })
  async blockUser(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.blockUser(id);
  }

  // =========================================
  // ADMIN - DESBLOQUEAR USUARIO
  // =========================================

  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/unblock')
  @ApiOperation({
    summary: 'Desbloquear usuario (Admin)',
    description: 'Desbloquea un usuario previamente bloqueado.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario desbloqueado correctamente',
  })
  async unblockUser(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.unblockUser(id);
  }
}
