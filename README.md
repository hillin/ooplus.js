# ooplus.js
Utilities to improve object-oriented programming in JavaScript and Typescript.

## Getting Started

You can get ooplus.js on [npm](https://www.npmjs.com/package/ooplus-js).

## Use Cases

### Add functionalities an existing class

```typescript
import { enhance, property } from "ooplus-js"

class MyClass {
    baseValue = 40;
}

interface EnhancedClass extends MyClass {
    newValue: number;
    newProperty: number;
    newMethod();
}

enhance(MyClass, {
    newValue: 2,
    newProperty: property({
        writable: true
    }),
    newMethod: function(this: EnhancedClass) {
        this.newProperty = this.newValue + this.baseValue;
    }
});
```

This code enhances `MyClass` to add two properties `newValue`, `newProperty` and a method `newMethod`.

A property can be added in two ways: with the `property` function and a [PropertyDescriptor](https://www.javascripture.com/PropertyDescriptor), or a direct value. Method is actually a property too, with a type of `function`.

### Calling super

```typescript
import { enhance, $super } from "ooplus-js"

class BaseClass {
    protected /*virtual*/ action() { 
        console.info("base action")
    }
}

class DerivedClass {
    
}

interface EnhancedDerivedClass extends DerivedClass {
    action();
}

enhance(DerivedClass, {
    action(this: EnhancedDerivedClass) {
        $super(this).action();
        console.info("derived action")
    }
})
```

The `$super` function here mimics the ES6 `super` syntax, to call a method defined in the base/ancestor class.

### Dynamic inheritance

```typescript
import { extend } from "ooplus-js"
class BaseClass {
    constructor(readonly value: number) {}
}

interface DerivedClass extends BaseClass {
    value1: number;
    value2: number;
}

const derivedClass = extend(BaseClass, {
    preConstructor(value1: number, value2: number) {
        return [ value1 + value2 ];
    },
    
    constructor(value1: number, value2: number) {
        this.value1 = value1;
        this.value2 = value2;
    }
});

const instance = new derivedClass(22, 20);
```

The `extend` function works like the `enhance` function, but rather than enhancing the existed class, it creates a new class inheriting from the specified base class. This example dynamically creates a class `derivedClass`. 

While using the `enhance` function, the new class' constructor is split into two functions: a `preConstructor` and a `constructor`. Both functions will receive the same parameters. The pre-constructor is like code before the `super` call which calls the base class' constructor in a typical ES6 class constructor code, it can handle pre-processing of the arguments, and should return an array of parameters which will be used to call the base class' constructor. The `constructor` function is like the code after the `super` call, which can do all sorts of initializations. The code above is analog to the following ES6 code:

```typescript
class BaseClass {
    constructor(readonly value: number) {}
}

class DerivedClass extends BaseClass {
    constructor(value1: number, value2: number) {
        super(value1 + value2);
        this.value1 = value1;
        this.value2 = value2;
    }
});
```

Note in the `preConstructor`, the `this` object in the `preConstructor` is called a *courier* object, anything stored in it will be assigned to the instance created later. However it does not represent the class instance to be created. which will not be available until the `constructor` function (just like you can't use `this` before the `super` call in an ES6 class constructor). 
