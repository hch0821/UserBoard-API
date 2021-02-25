import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateUserInput } from './dto/create-user.dto';
import { LoginInput, LoginOutput } from './dto/login-user.dto';
import { UserOutput } from './dto/user-output.dto';
import { JwtService } from './jwt/jwt.service';
import { User } from './user.model';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private _usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // 계정 생성
  async createUser({ name, password }: CreateUserInput): Promise<UserOutput> {
    try {
      const sameUser = await this._usersRepository.findOne({
        name,
      });
      if (sameUser) {
        return {
          ok: false,
          error: 'The name is in use.',
        };
      }

      const createdUser: User = await this._usersRepository.create({
        name,
        password,
      });
      await this._usersRepository.save(createdUser);
      return {
        ok: true,
        ...createdUser,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Fail to create user.',
      };
    }
  }

  // 로그인
  async loginUser({ name, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this._usersRepository.findOne({ name });
      if (!user) {
        return { ok: false, error: 'The username or password is not correct.' };
      }

      const isPasswordCorrect: boolean = await user.checkPassword(password);
      if (!isPasswordCorrect) {
        return { ok: false, error: 'The username or password is not correct.' };
      } else {
        return { ok: true, token: this.jwtService.getToken(user.id) };
      }
    } catch (e) {
      return {
        ok: false,
        error: 'Fail to login.',
      };
    }
  }

  // 계정 삭제
  async deleteUser(userId): Promise<UserOutput> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        return { ok: false, error: 'The user is not exists.' };
      }
      user.deletedAt = new Date();
      await this._usersRepository.save(user);
      return {
        ok: true,
        ...user,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Fail to delete user.',
      };
    }
  }

  // 아이디로 유저 정보 찾기
  async findById(id: number): Promise<User> {
    return await this._usersRepository.findOne({ id, deletedAt: IsNull() });
  }
}
