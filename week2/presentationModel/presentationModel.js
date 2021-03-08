
import { Observable } from "../observable/observable.js";
import { id }         from "../church/church.js";

export { Attribute }

const Attribute = value => {

    const valueObs = Observable(value);
    const validObs = Observable(true);

    let converter = id;
    const setConverter = newConverter => {
        converter = newConverter; // TODO: newConverter is not a constructor
        setConvertedValue(valueObs.getValue());
    };

    const setValidator = validator => valueObs.onChange(newValue => valueObs.setValue(validator(newValue)) );
    const setConvertedValue = newValue => valueObs.setValue(converter(newValue));

    return { valueObs, validObs, setConverter, setValidator, setConvertedValue }
};
