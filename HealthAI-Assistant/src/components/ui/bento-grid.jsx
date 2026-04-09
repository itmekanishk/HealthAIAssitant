import { cn } from "@/lib/utils";
const BentoGrid = ({ children, className, ...props }) => {
    return (<div className={cn("grid w-full auto-rows-[22rem] grid-cols-3 gap-4", className)} {...props}>
      {children}
    </div>);
};
const BentoCard = ({ name, className, background, Icon, description, onClick, ...props }) => {
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };
    return (<div key={name} className={cn("group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl cursor-pointer", 
        "bg-card border border-border/60 shadow-sm", "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40", "transition-all duration-500 ease-out hover:scale-[1.02]", className)} onClick={handleClick} {...props}>
      <div>{background}</div>
      <div className="p-6 relative z-10">
        <div className="flex transform-gpu flex-col gap-2 transition-all duration-500 ease-out">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white transition-all duration-500 ease-out group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-blue-500/50">
            <Icon className="h-6 w-6 transition-transform duration-500 group-hover:scale-110"/>
          </div>
          <h3 className="text-lg font-semibold text-foreground mt-2 transition-all duration-300 group-hover:text-primary group-hover:translate-x-1">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground transition-all duration-300 group-hover:text-foreground">{description}</p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-500 ease-out group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-transparent"/>
    </div>);
};
export { BentoCard, BentoGrid };
