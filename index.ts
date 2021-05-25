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
export function callSuper(target: object, methodName: string, ...args: unknown[]) {

    let base = ("$BaseReference" in target)
        ? target["$BaseReference"]
        : target;

    const directBaseMethod = base[methodName];

    let isSuper = false;
    while (base) {
        const descriptor = Object.getOwnPropertyDescriptor(base, methodName);
        if (descriptor) {
            if (descriptor.value === directBaseMethod) {
                isSuper = true;
            } else if (isSuper) {
                // We need to pass the original object to apply() as first argument,
                // this allow to keep original instance definition along all method
                // inheritance. But we also need to save reference to "base" who
                // contain parent class, it will be used into this function startup
                // to begin at the right chain position.
                target["$BaseReference"] = base;
                const result = descriptor.value.apply(target, args);
                // Property have been used into super function if another
                // callSuper() is launched. Reference is not useful anymore.
                delete target["$BaseReference"];
                return result;
            }
        }
        // Iterate to the next parent inherited.
        base = Object.getPrototypeOf(base);
    }

    return undefined;
}

/**
 * Get a proxy object which can be used to call methods in the super class(-es).
 *
 * This function caches the super proxy within the specified object to prevent creating
 * multiple proxies for a single object.
 * @param $this target whose super class is to be proxied.
 */
export function $super<T extends object>($this: T): T {

    if ("$SuperProxy" in $this) {
        return $this["$SuperProxy"] as T;
    }

    const proxy = new Proxy($this,
        {
            get(target: T, property: string) {
                return (...args) => {
                    return callSuper(target, property, ...args);
                }
            }
        });

    $this["$SuperProxy"] = proxy;

    return proxy;
}

interface MarkedPropertyDescriptor extends PropertyDescriptor {
    $IsPropertyDescriptor: true;
}

function isMarkedPropertyDescriptor(target: unknown) {
    return Object.prototype.hasOwnProperty.call(target, "$IsPropertyDescriptor");
}

/**
 * Define a property which can be used in a @see MemberMap.
 * @param descriptor The property descriptor.
 */
export function property(descriptor: PropertyDescriptor): PropertyDescriptor {
    (descriptor as MarkedPropertyDescriptor).$IsPropertyDescriptor = true;
    return descriptor;
}

export type Constructor<T> = new (...args) => T;
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
export function enhance<TClass, TConstructor extends Constructor<TClass>>(
    constructor: TConstructor,
    members: MemberMap): TConstructor {

    for (const key in members) {
        if (!Object.prototype.hasOwnProperty.call(members, key)) {
            continue;
        }

        const member = members[key];

        if (isMarkedPropertyDescriptor(member)) {
            const propertyDescriptor = member as MarkedPropertyDescriptor;
            Object.defineProperty(constructor.prototype, key, propertyDescriptor);
        } else {
            constructor.prototype[key] = member;
        }
    }

    return constructor;
}

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
    preConstructor?: (...args) => ArrayLike<unknown>;

    /**
     * The constructor of the class. This is analog to the code after the `super`
     * call in a normal ES6 constructor.
     */
    constructor?: (...args) => void;
}

/**
 * Create a new class, extending from an existed base class.
 *
 * This method enables dynamic inheritance from classic function and prototype based
 * classes and ES6 classes.
 * @param baseClass The base class to extend.
 * @param classDescriptor The descriptor of the new class.
 */
export function extend<TClass, TConstructor extends Constructor<TClass>>(
    baseClass: TConstructor,
    classDescriptor: ClassDescriptor) {

    // ReSharper disable once Lambda
    // : constructor cannot be arrow function
    const derivedClass = function(...args) {
        const courier = {};
        let baseArgs: ArrayLike<unknown> = args;
        if (classDescriptor.preConstructor) {
            baseArgs = classDescriptor.preConstructor.apply(courier, args);
        }

        const result = Reflect.construct(
            baseClass,
            baseArgs,
            derivedClass);

        Object.assign(result, courier);

        if (classDescriptor.constructor) {
            classDescriptor.constructor.apply(result, args);
        }

        return result;
    }

    // set up inheritance
    derivedClass.prototype = Object.create(baseClass.prototype);

    // apply members
    for (const key in classDescriptor) {
        if (!Object.prototype.hasOwnProperty.call(classDescriptor, key)) {
            continue;
        }

        if (key === "preConstructor" || key === "constructor") {
            continue;
        }

        const member = classDescriptor[key];

        if (isMarkedPropertyDescriptor(member)) {
            const propertyDescriptor = member as MarkedPropertyDescriptor;
            Object.defineProperty(derivedClass.prototype, key, propertyDescriptor);
        } else {
            derivedClass.prototype[key] = member;
        }
    }

    return derivedClass;
}