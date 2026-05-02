export declare class PasswordUtil {
    static hash(password: string): Promise<string>;
    static compare(password: string, hash: string): Promise<boolean>;
    static validate(password: string): {
        valid: boolean;
        errors: string[];
    };
}
export default PasswordUtil;
//# sourceMappingURL=password.d.ts.map