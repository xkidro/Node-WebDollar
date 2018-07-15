class Logger{

    constructor(name){
        this.name = name;
    }

    error(){
        console.log('\x1b[31m%s\x1b[0m', this.name, "\x1b[0m", this.convertArguments.apply(this, arguments) );
    }

    info(){
        console.log('\x1b[34m%s\x1b[0m', this.name, "\x1b[0m", this.convertArguments.apply(this, arguments) );
    }

    debug(){
        console.log('\x1b[32m%s\x1b[0m', this.name, "\x1b[0m", this.convertArguments.apply(this, arguments) );
    }

    warn(){
        console.log('\x1b[33m%s\x1b[0m', this.name, "\x1b[0m", this.convertArguments.apply(this, arguments) );
    }

    convertArguments(){

        let s=  '';
        for (let i=0; i<arguments.length; i++) {

            if (arguments[i] === undefined) continue;

            s += arguments[i];

            if (typeof arguments[i] === "string") s += arguments[i];
            else s += JSON.stringify(arguments[i]);

            s += "   ";
        }

        return s;

    }

}

export default Logger;