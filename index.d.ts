/**
 * Call super method of the given object and method.
 * This function create a temporary variable called "_call_base_reference",
 * to inspect whole inheritance linage. It will be deleted at the end of inspection.
 *
 * @param {object} target The owner object of the method and inheritance linage
 * @param {string} methodName The name of the super method to find.
 * @param {array} args The calls arguments, basically use the "arguments" special variable.
 * @returns {*} The data returned from the super method.
 */
export declare function callSuper(target: object, methodName: string, ...args: unknown[]): any;
/**
 * Get a proxy object which can be used to call methods in the super class(-es).
 *
 * This function caches the super proxy within the specified object to prevent creating
 * multiple proxies for a single object.
 * @param $this target whose super class is to be proxied.
 */
export declare function $super<T extends object>($this: T): T;
/**
 * Define a property which can be used in a @see MemberMap.
 * @param descriptor The property descriptor.
 */
export declare function property(descriptor?: PropertyDescriptor): PropertyDescriptor;
export declare type Constructor<T> = new (...args: any[]) => T;
export interface MemberMap {
    [name: string]: PropertyDescriptor | unknown;
}
/**
 * Enhance the specified class to add members to it. This can be used like mixin or
 * multiple inheritance, but provide more versatility over mixin which allows you to
 * access and override all the members of the class to enhance.
 * @param constructor The class constructor to enhance.
 * @param members An object which contains one or more methods or property descriptors.
 */
export declare function enhance<TClass, TConstructor extends Constructor<TClass>>(constructor: TConstructor, members: MemberMap): TConstructor;
export interface ClassDescriptor extends MemberMap {
    /**
     * The pre-constructor of the class. A pre-constructor is like the code before
     * the `super` call to call the base class' constructor in an ES6 class,
     * typically carries out preprocessing of the constructor arguments.
     * This function should return an array which contains the parameters to call
     * the base class' constructor.
     *
     * If a pre-constructor is not specified, any arguments passed to the class'
     * constructor will be used to call the base class' constructor.
     *
     * Note in the pre-constructor, you can use the `this` object, but it does
     * not represent the instance to be created, because technically it is not
     * available at the moment. The `this` object in the pre-constructor context is
     * a "courier" object, in which anything stored will be assigned to the real
     * instance created later.
     */
    preConstructor?: (...args: any[]) => ArrayLike<unknown>;
    /**
     * The constructor of the class. This is analog to the code after the `super`
     * call in a normal ES6 constructor.
     */
    constructor?: (...args: any[]) => void;
}
/**
 * Create a new class, extending from an existed base class.
 *
 * This method enables dynamic inheritance from classic function and prototype based
 * classes and ES6 classes.
 * @param baseClass The base class to extend.
 * @param classDescriptor The descriptor of the new class.
 */
export declare function extend<TClass, TConstructor extends Constructor<TClass>>(baseClass: TConstructor, classDescriptor: ClassDescriptor): {
    (...args: any[]): any;
    prototype: any;
};
