declare namespace Swagger {
  export interface Request {
    headers?: Record<string, string>;
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: any;
  }

  export interface Response {
    description: string;
    schema?: any;
    examples?: Record<string, any>;
  }

  export interface Security {
    bearerAuth?: string[];
  }

  export interface Parameter {
    in: 'path' | 'query' | 'header' | 'formData' | 'body';
    name: string;
    description?: string;
    required?: boolean;
    type?: string;
    schema?: any;
    enum?: string[];
  }

  export interface SchemaObject {
    type?: string;
    format?: string;
    description?: string;
    example?: any;
    properties?: Record<string, SchemaObject>;
    required?: string[];
    items?: SchemaObject;
    $ref?: string;
    enum?: string[];
    minimum?: number;
    maximum?: number;
    pattern?: string;
    nullable?: boolean;
  }
}

declare global {
  namespace Express {
    interface Application {
      swagger?: any;
    }
  }
}

export {};
