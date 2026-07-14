"""
Generate bcrypt password hashes for InvenIQ user accounts.

Run this once locally, then copy the printed values into your backend/.env file
as ADMIN_PASSWORD_HASH, MANAGER_PASSWORD_HASH, VIEWER_PASSWORD_HASH.

Never commit the resulting .env file -- it's already in .gitignore.

Usage:
    python generate_hashes.py
"""
import bcrypt
import getpass


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def main():
    users = [
        ("admin", "ADMIN_PASSWORD_HASH"),
        ("manager", "MANAGER_PASSWORD_HASH"),
        ("viewer", "VIEWER_PASSWORD_HASH"),
    ]

    print("=" * 60)
    print("InvenIQ -- bcrypt password hash generator")
    print("=" * 60)
    print("Enter a password for each account. Input is hidden.\n")

    results = {}
    for username, env_var in users:
        while True:
            pw1 = getpass.getpass(f"Password for '{username}': ")
            if len(pw1) < 8:
                print("  -> Password too short, use at least 8 characters.\n")
                continue
            pw2 = getpass.getpass(f"Confirm password for '{username}': ")
            if pw1 != pw2:
                print("  -> Passwords didn't match, try again.\n")
                continue
            break
        results[env_var] = hash_password(pw1)

    print("\n" + "=" * 60)
    print("Copy these lines into backend/.env (replace existing values):")
    print("=" * 60)
    for env_var, hashed in results.items():
        print(f"{env_var}={hashed}")
    print("=" * 60)


if __name__ == "__main__":
    main()