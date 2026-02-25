import React from 'react';

/**
 * UserMessage — displays a user message (right-aligned, blue background).
 *
 * @param {object} props
 * @param {string} props.content - Message text
 * @returns {React.ReactElement}
 */
const UserMessage = React.memo(function UserMessage({ content }) {
  return (
    <div className="flex justify-end">
      <div className="bg-blue-600 text-white rounded-lg px-4 py-3 max-w-xs lg:max-w-md break-words text-sm">
        {content}
      </div>
    </div>
  );
});

export default UserMessage;
