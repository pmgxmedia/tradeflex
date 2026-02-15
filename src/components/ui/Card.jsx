const Card = ({ children, className = '', hover = false, onClick, variant = 'default' }) => {
  const baseStyles = 'bg-white overflow-hidden transition-all duration-300';
  
  const variants = {
    default: 'rounded-2xl shadow-sm border border-gray-100',
    flat: 'rounded-3xl border-none bg-gray-50',
    elevated: 'rounded-2xl shadow-md hover:shadow-xl',
    glass: 'rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-sm',
  };

  const hoverClass = hover ? 'cursor-pointer transform hover:-translate-y-1' : '';
  
  return (
    <div 
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
