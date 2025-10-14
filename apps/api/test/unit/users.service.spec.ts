import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { UsersService } from "../../src/users/users.service";
import { UsersRepository } from "../../src/users/users.repository";
import { CreateUserDto } from "../../src/users/dto/create-user.dto";
import { User } from "generated/prisma";

// Mock the bcrypt module
jest.mock("bcrypt");

// Mock the UsersRepository
const mockUsersRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  activateUser: jest.fn(),
  deactivateUser: jest.fn(),
  count: jest.fn(),
};

describe("UsersService", () => {
  let usersService: UsersService;
  let usersRepository: UsersRepository;

  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    username: "testuser",
    password: "hashedPassword",
    isActive: true,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createUserDto: CreateUserDto = {
    email: "test@example.com",
    username: "testuser",
    password: "password123",
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(UsersRepository);

    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return paginated users", async () => {
      const mockUsers = [mockUser, { ...mockUser, id: "2" }];
      mockUsersRepository.findAll.mockResolvedValue(mockUsers);
      mockUsersRepository.count.mockResolvedValue(2);

      const result = await usersService.findAll(1, 10);

      expect(usersRepository.findAll).toHaveBeenCalled();
      expect(usersRepository.count).toHaveBeenCalled();
      expect(result).toEqual({
        users: mockUsers.slice(0, 10),
        total: 2,
      });
    });

    it("should handle empty user list", async () => {
      mockUsersRepository.findAll.mockResolvedValue([]);
      mockUsersRepository.count.mockResolvedValue(0);

      const result = await usersService.findAll(1, 10);

      expect(result).toEqual({
        users: [],
        total: 0,
      });
    });
  });

  describe("findById", () => {
    it("should return user by id", async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);

      const result = await usersService.findById("1");

      expect(usersRepository.findById).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException if user not found", async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(usersService.findById("1")).rejects.toThrow(
        NotFoundException,
      );
      expect(usersRepository.findById).toHaveBeenCalledWith("1");
    });
  });

  describe("create", () => {
    it("should create user successfully", async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
      mockUsersRepository.create.mockResolvedValue(mockUser);

      const result = await usersService.create(createUserDto);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(usersRepository.findByUsername).toHaveBeenCalledWith(
        createUserDto.username,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(usersRepository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        username: createUserDto.username,
        password: "hashedPassword",
        isActive: createUserDto.isActive,
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw ConflictException if email exists", async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(usersRepository.findByUsername).not.toHaveBeenCalled();
    });

    it("should throw ConflictException if username exists", async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.findByUsername.mockResolvedValue(mockUser);

      await expect(usersService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(usersRepository.findByUsername).toHaveBeenCalledWith(
        createUserDto.username,
      );
    });
  });

  describe("update", () => {
    const updateData = {
      email: "new@example.com",
      username: "newuser",
      password: "newpassword",
    };

    it("should update user successfully", async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("newHashedPassword");
      const updatedUser = {
        ...mockUser,
        ...updateData,
        password: "newHashedPassword",
      };
      mockUsersRepository.update.mockResolvedValue(updatedUser);

      const originalPassword = updateData.password;
      const result = await usersService.update("1", updateData);

      expect(usersRepository.findById).toHaveBeenCalledWith("1");
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        updateData.email,
      );
      expect(usersRepository.findByUsername).toHaveBeenCalledWith(
        updateData.username,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(originalPassword, 10);
      expect(usersRepository.update).toHaveBeenCalledWith("1", {
        ...updateData,
        password: "newHashedPassword",
      });
      expect(result).toEqual(updatedUser);
    });

    it("should not check email if email not changed", async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("newHashedPassword");
      mockUsersRepository.update.mockResolvedValue(mockUser);

      await usersService.update("1", {
        username: "newuser",
        password: "newpassword",
      });

      expect(usersRepository.findByEmail).not.toHaveBeenCalled();
    });

    it("should throw ConflictException if new email exists", async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        id: "2",
      });

      await expect(
        usersService.update("1", { email: "existing@example.com" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should throw ConflictException if new username exists", async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.findByUsername.mockResolvedValue({
        ...mockUser,
        id: "2",
      });

      await expect(
        usersService.update("1", { username: "existinguser" }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("delete", () => {
    it("should delete user successfully", async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.delete.mockResolvedValue(undefined);

      await usersService.delete("1");

      expect(usersRepository.findById).toHaveBeenCalledWith("1");
      expect(usersRepository.delete).toHaveBeenCalledWith("1");
    });

    it("should throw NotFoundException if user not found", async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(usersService.delete("1")).rejects.toThrow(NotFoundException);
      expect(usersRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("activateUser", () => {
    it("should activate user successfully", async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.activateUser.mockResolvedValue({
        ...mockUser,
        isActive: true,
      });

      const result = await usersService.activateUser("1");

      expect(usersRepository.findById).toHaveBeenCalledWith("1");
      expect(usersRepository.activateUser).toHaveBeenCalledWith("1");
      expect(result.isActive).toBe(true);
    });
  });

  describe("deactivateUser", () => {
    it("should deactivate user successfully", async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.deactivateUser.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await usersService.deactivateUser("1");

      expect(usersRepository.findById).toHaveBeenCalledWith("1");
      expect(usersRepository.deactivateUser).toHaveBeenCalledWith("1");
      expect(result.isActive).toBe(false);
    });
  });
});
