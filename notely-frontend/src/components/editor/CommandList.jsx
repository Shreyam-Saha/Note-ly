import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const CommandList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = index => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-popover border text-popover-foreground shadow-md rounded-md overflow-hidden p-1 flex flex-col gap-1 w-48 z-50">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`flex items-center px-2 py-1.5 text-sm rounded-sm text-left hover:bg-accent hover:text-accent-foreground ${
              index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item.title}
          </button>
        ))
      ) : (
        <div className="p-2 text-sm text-muted-foreground">No results</div>
      )}
    </div>
  );
});

CommandList.displayName = 'CommandList';

export default CommandList;
