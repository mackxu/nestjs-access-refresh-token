import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserLoginDto } from './dto/user-login.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  @Post('login')
  async login(@Body() loginUser: UserLoginDto) {
    const user = await this.userService.login(loginUser);
    const accessToken = this.jwtService.sign(
      {
        username: user.username,
        userId: user.id,
      },
      {
        expiresIn: '1m',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        userId: user.id,
      },
      {
        expiresIn: '10m',
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  @Get('refresh')
  async refresh(@Query('token') token: string) {
    try {
      const data = this.jwtService.verify(token);
      const user = await this.userService.findUserById(data.userId);
      const accessToken = this.jwtService.sign(
        {
          username: user.username,
          userId: user.id,
        },
        {
          expiresIn: '1m',
        },
      );

      const refreshToken = this.jwtService.sign(
        {
          userId: user.id,
        },
        {
          expiresIn: '10m',
        },
      );

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('token 无效, 请重新登录');
    }
  }
}
