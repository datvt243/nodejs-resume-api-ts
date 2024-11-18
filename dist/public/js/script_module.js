export const createElementToast = (props) => {
    const toastBG = props.type === 'success' ? 'text-bg-success' : 'text-bg-danger';
    const html = `
        <div class="toast-container position-fixed top-0 end-0 p-2">
            <div id="${props.id || 'toastEx'}" class="toast ${toastBG}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header ${toastBG}">
                    <strong class="me-auto">Thông báo</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${props.text || ''}
                </div>
            </div>
        </div>
    `;

    const elm = document.getElementById('jsAppend');
    elm.innerHTML = html;
};

export const showToast = (props) => {
    const { type = 'success', text = '' } = props;
    const toastId = 'toastMess';
    createElementToast({
        id: toastId,
        type,
        text: text || '',
    });

    const toastElm = document.getElementById(toastId);
    if (toastElm) {
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastElm);
        toastBootstrap.show();
    }
};
