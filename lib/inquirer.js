const inquirer = require('inquirer');

module.exports = {
  init: () => {
    const questions = [
      {
        name: 'operation',
        type: 'list',
        message: 'what do you want to do?',
        choices: ['compare','fix fractions']
      }
    ];
    return inquirer.prompt(questions);
  },

  propmptLocation: (files) => {
    const questions = [
        {
            name: 'operation',
            type: 'list',
            message:'Choose a directory or file',
            choices: ['.','..',...files]
        }
    ];

    return inquirer.prompt(questions)
  }
};