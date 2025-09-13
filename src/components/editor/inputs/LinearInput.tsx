import { Slider, SliderProps } from '@mui/material';

export const LinearInput = (props: SliderProps) => {
    return (
        <div className="w-full flex items-center gap-5">
            <Slider 
                min={props.min || 0} 
                max={props.max || 200} 
                step={props.step || 1} 
                valueLabelDisplay="auto" 
                {...props} 
            />
        </div>
    );
};