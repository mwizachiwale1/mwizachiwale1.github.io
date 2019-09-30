using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
namespace Ibas_accounts
{
    #region Authentication
    public class Authentication
    {
        #region Member Variables
        protected int _id;
        protected string _username;
        protected string _password;
        protected string _profile_photo;
        protected string _position;
        protected int _pv_position;
        #endregion
        #region Constructors
        public Authentication() { }
        public Authentication(string username, string password, string profile_photo, string position, int pv_position)
        {
            this._username=username;
            this._password=password;
            this._profile_photo=profile_photo;
            this._position=position;
            this._pv_position=pv_position;
        }
        #endregion
        #region Public Properties
        public virtual int Id
        {
            get {return _id;}
            set {_id=value;}
        }
        public virtual string Username
        {
            get {return _username;}
            set {_username=value;}
        }
        public virtual string Password
        {
            get {return _password;}
            set {_password=value;}
        }
        public virtual string Profile_photo
        {
            get {return _profile_photo;}
            set {_profile_photo=value;}
        }
        public virtual string Position
        {
            get {return _position;}
            set {_position=value;}
        }
        public virtual int Pv_position
        {
            get {return _pv_position;}
            set {_pv_position=value;}
        }
        #endregion
    }
    #endregion
}