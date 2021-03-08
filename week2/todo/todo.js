import { ObservableList, Observable } from "../observable/observable.js";
import { Attribute }      from "../presentationModel/presentationModel.js";
import { Scheduler }      from "../dataflow/dataflow.js";
import { fortuneService } from "./fortuneService.js";

export { TodoController, TodoItemsView, TodoTotalView, TodoOpenView, TodoDetailView}

const TodoController = () => {

    const Todo = () => {                               // facade
        const textAttr = Attribute("Master-Detail-View");
        const doneAttr = Attribute(false);

        textAttr.setConverter( input => input.toUpperCase() );

        return {
            getDone:            doneAttr.valueObs.getValue,
            setDone:            doneAttr.valueObs.setValue,
            onDoneChanged:      doneAttr.valueObs.onChange,
            getText:            textAttr.valueObs.getValue,
            setText:            textAttr.setConvertedValue,
            onTextChanged:      textAttr.valueObs.onChange,
            onTextValidChanged: textAttr.validObs.onChange,
        }
    };

    const selectedTodo = Observable(null);
    const todoModel = ObservableList([]);	// observable array of Todos, this state is private
    const scheduler = Scheduler();

    const addTodo = () => {
        const newTodo = Todo();
        todoModel.add(newTodo);
        return newTodo;
    };

    const selectTodo = todo => selectedTodo.setValue(todo);

    const addFortuneTodo = () => {

        const newTodo = Todo();

        todoModel.add(newTodo);
        newTodo.setText('...');

        scheduler.add( ok =>
           fortuneService( text => {
                   newTodo.setText(text);
                   ok();
               }
           )
        );

    };

    return {
        numberOfTodos:      todoModel.count,
        numberOfopenTasks:  () => todoModel.countIf( todo => ! todo.getDone() ),
        addTodo:            addTodo,
        addFortuneTodo:     addFortuneTodo,
        removeTodo:         todoModel.del,
        onTodoAdd:          todoModel.onAdd,
        onTodoRemove:       todoModel.onDel,
        selectTodo:     	selectTodo,
        onTodoSelected:     selectedTodo.onChange,
        removeTodoRemoveListener: todoModel.removeDeleteListener, // only for the test case, not used below
    }
};


// View-specific parts

const TodoItemsView = (todoController, rootElement) => {

    const render = todo => {

        function createElements() {
            const template = document.createElement('DIV'); // only for parsing
            template.innerHTML = `
                <button class="delete">&times;</button>
                <div id="todoTitle"></div>
                <div id="todoDone"></div>
                <button>Select</button>        
            `;
            return template.children;
        }

        const [deleteButton, textLabel, todoDone, showButton] = createElements();

        showButton.onclick = _ => todoController.selectTodo(todo);
        deleteButton.onclick    = _ => todoController.removeTodo(todo);

        todoController.onTodoRemove( (removedTodo, removeMe) => {
            if (removedTodo !== todo) return;
            rootElement.removeChild(textLabel);
            rootElement.removeChild(deleteButton);
            rootElement.removeChild(showButton);
            rootElement.removeChild(todoDone);
            removeMe();
        } );

        todo.onTextChanged(() => {textLabel.innerHTML = todo.getText()});
        todo.onDoneChanged(() => {todoDone.innerHTML = todo.getDone() ? 'DONE' : 'OPEN'});

        rootElement.appendChild(deleteButton);
        rootElement.appendChild(textLabel);
        rootElement.appendChild(todoDone);
        rootElement.appendChild(showButton);
    };

    // binding

    todoController.onTodoAdd(render);

    // we do not expose anything as the view is totally passive.
};

const TodoDetailView = (todoController, rootElement) => {
    const infoLabel = document.createTextNode('No todo selected');

    const render = selectedTodo => {

        // show details only if todo is selected
        if (selectedTodo) {
			
            // remove unused elements before rendering
            if(infoLabel.parentNode != null && infoLabel.parentNode.contains(infoLabel)) {
                infoLabel.parentNode.removeChild(infoLabel)
            }
            if (rootElement.querySelector("#toDoDetail")) {
                while (rootElement.firstChild) {
                    rootElement.removeChild(rootElement.firstChild)
                }
            }
			
            const template = document.createElement('DIV'); // only for parsing
            function createElements() {
                template.innerHTML = `
                    <div id="toDoDetail"><b>Titel</b></div>
                    <input type="text" size="42">
                    <b>Done</b>
                    <input id="detailsCheckbox" type="checkbox">            
                `;
                return template.children;
            }

            const [labelTitle, inputElement, labelDone, checkboxElement] = createElements();

            checkboxElement.onclick = _ => selectedTodo.setDone(checkboxElement.checked);

            inputElement.oninput = _ => selectedTodo.setText(inputElement.value);
            selectedTodo.onTextChanged(() => inputElement.value = selectedTodo.getText());
			
            selectedTodo.onTextValidChanged(
                valid => valid
                    ? inputElement.classList.remove("invalid")
                    : inputElement.classList.add("invalid")
            );

            // set initial values
            checkboxElement.checked = selectedTodo.getDone();
            inputElement.value = selectedTodo.getText();
 
            rootElement.appendChild(labelTitle);
            rootElement.appendChild(inputElement);
            rootElement.appendChild(labelDone);
            rootElement.appendChild(checkboxElement);
        } else {
            // no todo selected
            rootElement.appendChild(infoLabel);
        }
    };

    // binding

    todoController.onTodoSelected(render);

    // we do not expose anything as the view is totally passive.
};

const TodoTotalView = (todoController, numberOfTasksElement) => {

    const render = () =>
        numberOfTasksElement.innerText = "" + todoController.numberOfTodos();

    // binding

    todoController.onTodoAdd(render);
    todoController.onTodoRemove(render);
};

const TodoOpenView = (todoController, numberOfOpenTasksElement) => {

    const render = () =>
        numberOfOpenTasksElement.innerText = "" + todoController.numberOfopenTasks();

    // binding

    todoController.onTodoAdd(todo => {
        render();
        todo.onDoneChanged(render);
    });
    todoController.onTodoRemove(render);
};
