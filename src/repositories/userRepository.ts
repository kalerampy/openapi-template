import { User } from "../models/user";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export class UserRepository {
	constructor(private db: D1Database) {}

	/**
	 * Generate a unique user ID
	 */
	private generateUserId(): string {
		return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
	}

	/**
	 * Hash a password
	 */
	async hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, SALT_ROUNDS);
	}

	/**
	 * Verify a password against a hash
	 */
	async verifyPassword(
		password: string,
		hash: string,
	): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}

	/**
	 * Create a new user
	 */
	async createUser(
		username: string,
		email: string,
		password: string,
	): Promise<User> {
		const userId = this.generateUserId();
		const passwordHash = await this.hashPassword(password);

		const result = await this.db
			.prepare(
				`INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
			)
			.bind(userId, username, email, passwordHash)
			.first<User>();

		if (!result) {
			throw new Error("Failed to create user");
		}

		return result;
	}

	/**
	 * Find a user by username
	 */
	async findByUsername(username: string): Promise<User | null> {
		const result = await this.db
			.prepare("SELECT * FROM users WHERE username = ?")
			.bind(username)
			.first<User>();

		return result;
	}

	/**
	 * Find a user by email
	 */
	async findByEmail(email: string): Promise<User | null> {
		const result = await this.db
			.prepare("SELECT * FROM users WHERE email = ?")
			.bind(email)
			.first<User>();

		return result;
	}

	/**
	 * Find a user by ID
	 */
	async findById(id: string): Promise<User | null> {
		const result = await this.db
			.prepare("SELECT * FROM users WHERE id = ?")
			.bind(id)
			.first<User>();

		return result;
	}

	/**
	 * Check if username exists
	 */
	async usernameExists(username: string): Promise<boolean> {
		const result = await this.db
			.prepare("SELECT 1 FROM users WHERE username = ? LIMIT 1")
			.bind(username)
			.first();

		return result !== null;
	}

	/**
	 * Check if email exists
	 */
	async emailExists(email: string): Promise<boolean> {
		const result = await this.db
			.prepare("SELECT 1 FROM users WHERE email = ? LIMIT 1")
			.bind(email)
			.first();

		return result !== null;
	}

	/**
	 * Authenticate a user by username and password
	 */
	async authenticate(
		username: string,
		password: string,
	): Promise<User | null> {
		const user = await this.findByUsername(username);

		if (!user) {
			return null;
		}

		const isValid = await this.verifyPassword(password, user.password_hash);

		if (!isValid) {
			return null;
		}

		return user;
	}
}
