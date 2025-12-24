// Temporary shim to satisfy @nestjs/core deep imports when package exports resolution drops @nestjs/common/interfaces.
declare module '@nestjs/common/interfaces' {
  // Minimal type surface to satisfy @nestjs/core deep imports during Docker builds.
  export interface ShutdownHooksOptions {
    signals?: string[];
  }

  export type Type<T = unknown> = new (...args: any[]) => T;
  export type ForwardReference<T = unknown> = () => Type<T>;

  export type Controller = object;
  export interface DynamicModule {
    module: Type<any>;
    imports?: any[];
    controllers?: any[];
    providers?: any[];
    exports?: any[];
    global?: boolean;
  }
  export interface ClassProvider<T = unknown> {
    provide: InjectionToken<T>;
    useClass: Type<T>;
  }
  export interface ValueProvider<T = unknown> {
    provide: InjectionToken<T>;
    useValue: T;
  }
  export interface FactoryProvider<T = unknown> {
    provide: InjectionToken<T>;
    useFactory: (...args: any[]) => T;
    inject?: InjectionToken[];
  }
  export interface ExistingProvider<T = unknown> {
    provide: InjectionToken<T>;
    useExisting: InjectionToken<T>;
  }
  export type Provider<T = unknown> =
    | Type<T>
    | ClassProvider<T>
    | ValueProvider<T>
    | FactoryProvider<T>
    | ExistingProvider<T>;

  export type Injectable = unknown;
  export type InjectionToken<T = unknown> = string | symbol | Type<T>;
  export interface NestModule {
    configure(consumer: MiddlewareConsumer): any;
  }
  export type SelectOptions = unknown;
  export type VersionValue = any;
  export type ContextType = string;
  export interface NestInterceptor {
    intercept(context: ExecutionContext, next: any): any;
  }
  export interface PipeTransform<T = any, R = any> {
    transform(value: T, metadata?: ArgumentMetadata): R | Promise<R>;
  }
  export interface ArgumentMetadata {
    type?: any;
    metatype?: Type<any> | undefined;
    data?: string | undefined;
  }
  export interface HttpServer<TRequest = any, TResponse = any, TApp = any> {
    applyVersionFilter(
      handler: Function,
      version: import('@nestjs/common/interfaces/version-options.interface').VersionValue,
      versioningOptions: import('@nestjs/common/interfaces/version-options.interface').VersioningOptions,
    ): (req: TRequest, res: TResponse, next: () => void) => Function;
  }
  export type MiddlewareConfigProxy = any;
  export interface MiddlewareConsumer {
    apply(...middleware: any[]): MiddlewareConfigProxy;
  }
  export interface RouteInfo {
    path?: string;
    method?: any;
    version?: any;
  }
  export type ExecutionContext = any;
  export interface ModuleMetadata {
    imports?: any[];
    controllers?: any[];
    providers?: any[];
    exports?: any[];
  }
  export type NestApplicationOptions = any;
  export type RequestHandler = any;
  export interface GlobalPrefixOptions<ExcludeRouteMetadata = any> {
    exclude?: ExcludeRouteMetadata[];
    prefix?: string;
  }

  export interface GetOrResolveOptions {
    strict?: boolean;
  }
  export interface CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean>;
  }
  export interface CallHandler<T = any> {
    handle(): any;
  }
  export interface ExecutionContextHost extends ExecutionContext {}
  export interface ParamsMetadata {
    type?: any;
    data?: any;
  }
  export type ParamsFactory = any;
  export type ExternalContextOptions = any;
  export type ContextId = any;
}

declare module '@nestjs/common/interfaces/version-options.interface' {
  export const VERSION_NEUTRAL: unique symbol;
  export type VersionValue = any;
  export interface VersioningOptions {
    defaultVersion?: VersionValue | VersionValue[];
  }
}
